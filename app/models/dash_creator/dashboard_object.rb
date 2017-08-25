module DashCreator
  class DashboardObject < ApplicationRecord
    validates_presence_of :code, unique: true

    # Acts as dashboard object for objects you want to display in your dashboard
  end
end
